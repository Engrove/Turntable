# Engrove Audio Toolkit

[![Netlify Status](https://api.netlify.com/api/v1/badges/4d71a3dc-4b8a-4d08-95c1-f8d47151b193/deploy-status)](https://app.netlify.com/sites/engrove/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An open-source collection of interactive web-based tools for the DIY audio enthusiast.

---

### **Live Application**

**Explore the toolkit live at: [engrove.netlify.app](https://engrove.netlify.app/)**

---

### About This Project

This project was born out of a passion for DIY audio and the "95% overthinking" philosophy detailed in the [Double Decker Madness Lenco Project](https://www.lencoheaven.net/forum/index.php?topic=45949.0) on the Lenco Heaven forums.

I'm not a professional engineer, just a layman with ambitions and imagination. This toolkit is my attempt to transform complex audio theory into a dynamic, visual, and intuitive environment. The goal is to create tools that allow fellow enthusiasts to explore the trade-offs in audio design in real-time.

### Current Modules

1.  **Tonearm Resonance Calculator:** An interactive simulator for calculating a tonearm's effective mass and its resonant frequency.
2.  **Compliance Estimator:** A data-driven tool to estimate a cartridge's dynamic compliance at 10Hz, using a statistical model for higher accuracy.

This is a live project, and features are added and updated sporadically.

### Disclaimer

This toolkit is provided as a design aid for theoretical exploration and educational purposes. The calculations are based on established physics, but are a product of a hobbyist project. There is no guarantee of the absolute accuracy of the calculations. Users are encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build rests with the user.

### Getting Started (For Local Development)

To run this project locally, you will need [Node.js](https://nodejs.org/) installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Engrove/Turntable.git
    cd Turntable
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173/`.

### Contributing

This is an open-source project built for the community. Feedback, bug reports, and suggestions are warmly welcomed. Please feel free to open an issue on the GitHub repository.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
