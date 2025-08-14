import re
import subprocess
import threading
import time
import yaml
import requests
import os

from flask import Flask, Response, jsonify, render_template, request

app = Flask(__name__)
bandwidth_pattern = r"(\d+\.\d+|\d+) (K|M|G)bits/sec"
SUM_pattern = r"\[\s*SUM\s*\]"
bandwidth_values = []
SUM_values = []

output_lines = []
streams = 0
selected_unit = "Mbps"

def convert_bandwidth(value, target_unit="Gbps"):
    print(value)
    """
    Args:
        value (str): The input bandwidth value (e.g., "2.7 Gbps", "2 Mbps").
        target_unit (str): The target unit ("Gbps", "Mbps", or "Kbps").
    Returns:
        float: The converted bandwidth value in the target unit.
    """
    unit_factors = {
        "Kbps": 1_000,
        "Mbps": 1_000_000,
        "Gbps": 1_000_000_000,
    }
    import re

    pattern = r"(\d+\.?\d*)\s*(K|M|G)bits/sec"
    match = re.match(pattern, value.strip())

    if not match:
        return 0.0

    number, unit = match.groups()
    number = float(number)
    source_unit = unit + "bps"
    print("DEBUG unit",source_unit,target_unit,source_unit not in unit_factors,target_unit not in unit_factors)

    if source_unit not in unit_factors or target_unit not in unit_factors:
        return 0.0

    value_in_bits = number * unit_factors[source_unit]

    converted_value = value_in_bits / unit_factors[target_unit]
    print(value, converted_value)
    return float(converted_value)


@app.route("/")
def index():
    with open("env.yaml") as f:
        config = yaml.safe_load(f)
    logos = config.get("logos", [])
    theme = config.get("theme", {})

    default_target = ""
    return render_template(
        "index.html", default_target=default_target, logos=logos, theme=theme
    )

@app.route("/test")
def test():
    with open("env.yaml") as f:
        config = yaml.safe_load(f)
    logos = config.get("logos", [])
    theme = config.get("theme", {})

    default_target = ""
    return render_template(
        "test.html", default_target=default_target, logos=logos, theme=theme
    )

@app.route("/proxy/iperf3-csv")
def proxy_csv():
    url = "https://export.iperf3serverlist.net/maddydev-glitch.csv"
    resp = requests.get(url)
    return Response(resp.content, content_type="text/csv")

# @app.route("/set_unit", methods=["POST"])
# def set_unit():
#     global selected_unit
#     data = request.get_json()

#     if not data or "unit" not in data:
#         return jsonify({"error": "No unit provided"}), 400

#     selected_unit = data["unit"]
#     print(f"Received unit from frontend: {selected_unit}")

#     return jsonify({"status": "success", "selected_unit": selected_unit})


@app.route("/run_iperf", methods=["POST"])
def run_iperf():
    global output_lines, streams, selected_unit
    output_lines = []

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input: No JSON provided"}), 400

    protocol = data.get("protocol")
    mode = data.get("mode")
    streams = data.get("streams", 1)
    target = data.get("target", "192.168.1.226")
    bandwidth = data.get("bandwidth", "0")
    port = data.get("port", "5201")
    selected_unit = data.get("units","Mbits")
    print("DEBUG",protocol,mode,streams,target,bandwidth,port,selected_unit)
    if not target:
        return jsonify({"error": "Target is required."}), 400

    if protocol not in ["tcp", "udp"]:
        return jsonify({"error": 'Invalid protocol. Must be "tcp" or "udp".'}), 400

    if streams == "0":
        return jsonify({"error": "Streams must be a positive integer."}), 400

    # Run iperf3 in a separate thread to avoid blocking the main thread
    def start_iperf():
        cmd = ["iperf3", "-c", target, "-p", str(port), "-P", str(streams)]
        if protocol == "udp":
            cmd.append("-u")
            cmd.append("-b")
            cmd.append(bandwidth)
            cmd.append("-t")
            cmd.append("10")
        if mode == "download":
            cmd.append("-R")
        cmd.append("--forceflush")
        print(cmd)
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        print("started")
        while True:
            output = process.stdout.readline()
            print(">> ", output)
            if output == "" and process.poll() is not None:
                break
            if output:
                output_lines.append(output.strip())
            time.sleep(0.1)
        print("out of loop")
        process.wait()

    # Start the iperf3 process in a background thread
    threading.Thread(target=start_iperf).start()

    return jsonify({"status": "iperf3 started"}), 200


@app.route("/stream_iperf", methods=["GET"])
def stream_iperf():
    def generate_output():
        global output_lines, streams, selected_unit
        print("DEBUG unit:",selected_unit)
        process_done = False  # Track process completion
        if streams == 1:
            while True:
                if not output_lines:
                    if process_done:
                        break
                    time.sleep(0.1)
                    continue

                if output_lines:
                    if "out-of-order" in output_lines[0]:
                        print(f"--- TEST COMPLETED ---\n\n")
                        yield f"data: -1\n\n"
                        process_done = True  # Mark process as done
                        break
                    output_line = output_lines[0]
                    print("debug if: ", output_line)
                    bandwidth_match = re.search(bandwidth_pattern, output_line)
                    if "[SUM]" in output_line and "bits/sec" in output_line:
                        if bandwidth_match:
                            sum_str = bandwidth_match.group(0)
                            sum_g = convert_bandwidth(sum_str, selected_unit)
                            SUM_values.append(sum_g)
                            print("hold on to old value")
                            print(f"data: {sum_g}\n\n")
                            yield f"data: {sum_g}\n\n"
                    else:
                        if bandwidth_match:
                            speed_str = bandwidth_match.group(0)
                            speed_g = convert_bandwidth(speed_str, selected_unit)
                            print(f"data: {speed_g}\n\n")
                            yield f"data: {speed_g}\n\n"
                            bandwidth_values.append(speed_g)
                        elif "iperf Done" in output_line:
                            print(f"--- TEST COMPLETED ---\n\n")
                            yield f"--- TEST COMPLETED ---\n\n"
                            yield f"data: -1\n\n"
                            process_done = True  # Mark process as done
                        elif (
                            "- - -" in output_line
                            or "[ ID] Interval           Transfer" in output_line
                            or "sender" in output_line
                            or not output_line.strip()
                        ):
                            print("hold on to old value")
                            if bandwidth_values:
                                print(f"data: {bandwidth_values[-1]}\n\n")
                                yield f"data: {bandwidth_values[-1]}\n\n"
                        elif process_done:  # Exit the generator when done
                            print(f"--- TEST COMPLETED ---\n\n")
                            yield f"data: -1\n\n"
                            break
                        else:
                            print(f"data: {0}\n\n")
                            yield f"data: {0}\n\n"
                            bandwidth_values.append(0)
                    if output_lines:
                        output_lines.pop(0)

            if SUM_values:
                yield f"data: {SUM_values[-1]}\n\n"

        else:
            while True:
                if not output_lines:
                    if process_done:
                        break
                    time.sleep(0.1)
                    continue

                if output_lines:
                    if "out-of-order" in output_lines[0]:
                        print(f"--- TEST COMPLETED ---\n\n")
                        yield f"data: -1\n\n"
                        process_done = True  # Mark process as done
                        break
                    output_line = output_lines[0]
                    # print("debug else: ", output_line)
                    if "server is busy" in output_line or "unable to send control message" in output_line:
                        print("data: server is busy\n\n")
                        yield f"data: server is busy\n\n"

                    bandwidth_match = re.search(bandwidth_pattern, output_line)
                    if (
                        "[SUM]" in output_line
                        and "bits/sec" in output_line
                        and "sender" not in output_line
                    ):
                        if bandwidth_match:
                            # print(">>: ", output_line)
                            sum_str = bandwidth_match.group(0)
                            sum_g = convert_bandwidth(sum_str, selected_unit)
                            SUM_values.append(sum_g)
                            print(f"data: {sum_g}\n\n")
                            yield f"data: {sum_g}\n\n"
                    elif "iperf Done" in output_line:
                        print(f"--- TEST COMPLETED ---\n\n")
                        yield f"data: -1\n\n"
                        process_done = True  # Mark process as done
                    elif process_done:  # Exit the generator when done
                        break

                    if output_lines:
                        output_lines.pop(0)

            if SUM_values:
                yield f"data: {SUM_values[-1]}\n\n"

    return Response(generate_output(), content_type="text/event-stream")


@app.route("/iperf_version", methods=["GET"])
def iperf_version():
    def get_iperf_version():
        cmd = "iperf3 -v | head -n 1"
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True
        )
        output, _ = process.communicate()
        return output.strip()

    def get_host_name_of_client():
        cmd = "hostname"
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True
        )
        output, _ = process.communicate()
        return output.strip()

    version = (
        str(get_iperf_version())
        + " client running on: "
        + str(get_host_name_of_client())
    )
    return jsonify({"version": version}), 200

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ["true", "1", "t"]
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
