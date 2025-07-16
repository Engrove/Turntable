# Engrove Audio Toolkit

[![Cloudflare Pages Deploy Status](https://static.cloudflareinsights.com/workers/pages/button/engrove.svg)](https://engrove.pages.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

An open-source collection of interactive web-based tools for the DIY audio enthusiast. Designed to bring complex audio theory into a dynamic, visual, and intuitive environment.

---

### **Live Application**

**Explore the full toolkit live at: [engrove.pages.dev](https://engrove.pages.dev/)**

*(A mirror is also available at `engrove.netlify.app` for comparison.)*

---

### About This Project

This project was born out of a passion for DIY audio and the "95% overthinking" philosophy detailed in the [Double Decker Madness Lenco Project](https://www.lencoheaven.net/forum/index.php?topic=45949.0) on the Lenco Heaven forums.

I'm not a professional engineer, just a layman with ambitions and imagination. This toolkit is my attempt to transform complex audio theory into a set of practical, interactive tools. The goal is to allow fellow enthusiasts to explore the trade-offs in audio design in real-time, verify component matching, and research parts for their next build.

### Current Modules

The toolkit currently consists of three main components:

1.  **Tonearm Resonance Calculator:** An advanced simulator for calculating a tonearm's effective mass and its resonant frequency when paired with a specific cartridge. It features detailed visualizations to explain the underlying physics of static balance and rotational inertia.

2.  **Compliance Estimator:** A data-driven tool to estimate a cartridge's dynamic compliance at 10Hz. Using a statistical model derived from our component database, it provides a realistic compliance range and a confidence score for its estimation, moving beyond simple multiplication factors.

3.  **Component Database Explorer:** A powerful search and filtering tool for our growing database of tonearms and cartridges. Users can filter by specifications like effective mass, compliance level, bearing type, and more, making it an essential resource for project planning and component research. The databases can also be downloaded as CSV files.

### Disclaimer

This toolkit is provided as a design aid for theoretical exploration and educational purposes. The calculations are based on established physics, but are the product of a hobbyist project. The data is compiled from a mix of manufacturer specifications and community-contributed sources. There is no guarantee of the absolute accuracy of the data or the calculations. Users are strongly encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build or component matching rests with the user.

### Getting Started (For Local Development)

To run this project locally, you will need [Node.js](https://nodejs.org/) installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Engrove/engrove.git
    cd engrove
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

### Deployment

This project uses a manual trigger system to control deployments on Netlify and Cloudflare Pages, helping to conserve build resources.

A new deployment is **only** triggered when the file `buildtrigger.txt` is modified and pushed to the `main` branch. Any other code changes pushed to the repository will **not** start a new build.

**To deploy your changes:**
1.  Make all your code changes and commit them.
2.  Open the `buildtrigger.txt` file.
3.  Make a small, trivial change (e.g., update the timestamp or add a space).
4.  Save, commit, and push this file. This final commit will trigger the deployment process on both hosting platforms.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
