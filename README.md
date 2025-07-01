# iPerf3-WebUI

**iPerf3-WebUI** is a modern, lightweight, web-based frontend for iPerf3, built using Python 3 and Flask.  
Run network speed tests easily from **any device** — macOS, Linux, Windows, or even Android phones (via Termux).

---
## Updates on v1.3.0.4 
 - Performance fixes (cpu utilization reduced)
 
## ✨ Features

- 🌐 **Web-based GUI** — Works in any browser
- ⚡ **Lightweight & Fast** — Built with Flask
- 🔥 **Python 3 Only** — No legacy Python 2.7 code
- 📈 **Live Speedometer** — Real-time results visualization
- 🔄 **Upload/Download Modes** — Easy switching
- 🌍 **Cross-platform** — Works on desktops, laptops, and mobile
- 🛠 **Customizable** — Streams, units (Kbits/Mbits/Gbits), target IP, Logos, themes

---

## 📸 Screenshots
<p align="left">
  <img src="https://raw.githubusercontent.com/MaddyDev-glitch/iperf3-webui/main/images/ipg1.PNG" alt="iPerf3 UI Screenshot 1" height="300" style="margin-right: 10px;"/>
  <img src="https://raw.githubusercontent.com/MaddyDev-glitch/iperf3-webui/main/images/ipg2.PNG" alt="iPerf3 UI Screenshot 2" height="300"/>
</p>

---

## 🚀 Getting Started

### 🔧 Option 1: Run Locally

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/iperf3-webui.git
cd iperf3-webui
```

#### 2. Install requirements

```bash
pip install -r requirements.txt
```

#### 3. Run the server

```bash
python3 app.py
```

By default, the app will be available at:  
👉 http://localhost:5000

(You can change the port inside `app.py` if needed.)

---

### 🐳 Option 2: Run as Docker Container (or Podman)

#### 1. Option A: Build and run the Docker image

```bash
docker build -f Containerfile -t iperf3-webui:v1.3.0.4 
docker run -it -p 5000:5000 -v ./env.yaml:/app/env.yaml iperf3-webui:v1.3.0.4

```
#### 2. Option B: Pull pre-built image from GitHub Container Registry

```bash
docker pull ghcr.io/maddydev-glitch/iperf3-webui:v1.3.0.4
```
📦 This pulls the latest pre-built image from:
https://github.com/MaddyDev-glitch/iperf3-webui/pkgs/container/iperf3-webui

🎨 Customize the Theme Using env.yaml
If you want to apply custom themes or settings, mount the env.yaml file into the container:
```bash
docker run -it -p 5000:5000 -v ./env.yaml:/app/env.yaml ghcr.io/maddydev-glitch/iperf3-webui:v1.3.0.4
```

Now access the Web UI at 👉 http://localhost:5000 from your browser.

---

## ⚙️ Requirements

- Python 3.6+ (Developed and Tested on Python 3.11.5)
- Flask 
- iPerf3 installed on your machine, iPerf3.exe is packaged in the repo

> On Linux, install iPerf3 via:  
> ```bash
> sudo apt install iperf3
> ```

---

## 👋 Usage

- Enter the **Target IP Address** you want to test against.
- Choose between **TCP** or **UDP**.
- Select **Upload** or **Download** mode.
- Set **streams** and **units** if needed.
- Click **Run iPerf3** and watch live results!

---

## 🎨 Theme Customization with env.yaml
Easily change your app’s look by editing env.yaml—no code required.

### ⚡ How to Customize
> Open env.yaml.

- Update values under logos and theme: for your colors, speedometer gradients, and logos.
- Save and reload the browser tab.

---

## 🧐 Why This Project?

Despite iPerf3 being one of the most popular and trusted speed testing tools, there are no proper, modern GUIs available today.
Most existing options are outdated, heavy, or tied to desktop platforms like Windows or Linux-only environments.

iPerf3-WebUI changes that — delivering a fast, lightweight, and fully web-based solution that runs anywhere Python 3 can: macOS, Linux, Windows, and even mobile (Termux on Android).

No messy installations, no clunky interfaces — just pure, streamlined performance testing from any device.

---

## ⚙️ What is iPerf3-WebUI?
iPerf3-WebUI is a parser and wrapper around the official iperf3 client.
It runs iperf3 as a background process, captures its command-line output in real time, and parses the results to present them in a modern, easy-to-use web interface.

Think of it as a lightweight bridge — combining the raw power of iperf3 with a clean, accessible UI for anyone to run network performance tests without touching the terminal.

No changes to iperf3 itself — just smarter, friendlier access to its results.

---

## 📄 License

This project is licensed under the **MIT License** with attribution.  
Feel free to use, modify, and distribute, but please give proper credit to the original author(s).

For more details, see the [LICENSE](LICENSE) file.

---

## Credits

Developed with ☕ and ❤️ by [MaddyDev-glitch (Srimadhaven Thirumurthy)](https://github.com/MaddyDev-glitch)

---

## 🔥 Bonus

If you like this project, consider giving it a ⭐️ on GitHub!

---

## 🚀 Feature Requests & Pull Requests
Have an idea to make iPerf3-WebUI even better?
Found a bug or missing feature?

Feel free to open an Issue for feature requests, bug reports, or suggestions.

Pull Requests (PRs) are very welcome!
If you fix a bug, improve the UI, or add new functionality, submit a PR to dev branch — let's build it together!

When contributing, please make sure your code is clean, readable, and tested.
Together, we can make the best modern UI for iPerf3!

---

#

