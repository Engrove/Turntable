### Quick Introduction

"Compliance" is simply a technical word for how soft or stiff the stylus suspension is—its "springiness." A high-compliance cartridge has a soft suspension and is best suited for lightweight tonearms. Conversely, a low-compliance cartridge has a stiffer suspension and needs a heavier tonearm to work correctly. Matching these two is like choosing the right tires for a car; it ensures stability and performance. The problem is that manufacturers measure this in different ways. This tool acts as a "translator," helping you get a comparable value so you can determine if your cartridge and tonearm are a good team.

***

#### In-Depth Explanation

**Compliance: The Stylus 'Shock Absorber'**

The cartridge stylus must follow the microscopic variations in the record groove with extreme precision, while being stable enough not to be affected by external vibrations. The cantilever is therefore mounted in a tiny, flexible rubber suspension. The measure of this suspension's flexibility is called compliance.

*   **High Compliance:** A soft suspension that moves easily. It requires a lightweight tonearm. If paired with a heavy arm, the system becomes unstable and "wobbly," much like a soft spring with too much weight on it. This was common in the 1970s with manufacturers like Shure and ADC.
*   **Low Compliance:** A stiff suspension that requires more force to move. It needs a heavy tonearm to keep the stylus firmly in the groove. If used with an arm that's too light, it can "bounce" in the groove and fail to read the information correctly. This is typical for many classic MC cartridges like the Denon DL-103.

**Why the Measurement Frequency is Crucial (10 Hz vs. 100 Hz)**

The biggest problem for enthusiasts is that manufacturers have historically specified compliance measured at different frequencies.

*   **Dynamic Compliance @ 10 Hz:** This is the international standard for calculating system resonance. The measurement is taken at 10 Hz because it is in this low-frequency range that the interaction between the arm's mass and the stylus's suspension is most critical (where problems with warps, etc., occur). Most European and American manufacturers use this standard.
*   **Dynamic Compliance @ 100 Hz:** Many Japanese manufacturers (like Audio-Technica and Denon) traditionally specify compliance measured at 100 Hz. This value is always lower than the 10 Hz value and is not directly usable for resonance calculations. A common rule of thumb has been to multiply the 100 Hz value by a factor between 1.5 and 2.2 to estimate the 10 Hz value, but this is a rough simplification.

**How This Tool Helps You**

This tool goes a step further than the rough rules of thumb. By analyzing a large database of cartridges where *both* 100 Hz and 10 Hz values are known, the tool can identify more precise patterns. It uses a hierarchical model that looks at the cartridge's type, materials, and stylus profile to find the most relevant conversion factor (the median ratio) for your specific situation. The "Confidence Score" then gives you a transparent indication of how reliable this data-driven estimate is, based on how many similar cartridges are in the analysis set. It does the same thing to convert "static compliance" (a measure of the suspension's flexibility under constant pressure) into the useful 10 Hz value.

<hr>

#### Full Technical Guide

For a deeper dive into the statistical models, the confidence score calculation, and a full FAQ, please open the full technical help document.

<button class="technical-help-link" onclick="window.triggerTechnicalHelp()">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M12 18h.01"></path><path d="M12 15c-2.28 0-4-1.72-4-4s1.72-4 4-4 4 1.72 4 4-1.72 4-4 4z"></path></svg>
  Open Full Methodology & User Guide
</button>

<hr>

#### Sources and Further Reading

1.  **ICOVP (2023).** *Vibration and Modal Analysis of a Tonearm-Cartridge System.* A modern, peer-reviewed conference paper using experimental modal analysis to investigate a tonearm system's natural frequencies, damping factors, and mode shapes.
2.  **Brüel & Kjær (1977).** *Audible Effects of Mechanical Resonances in Turntables.* This foundational paper explains the mechanical systems at play, which underpins the very reason why an accurate compliance value is necessary for system matching.
3.  **Korf Audio Blog.** A respected modern online resource that has conducted and published extensive independent research and measurements on the relationship between static, 100 Hz, and 10 Hz compliance values across a wide range of cartridges.
4.  **Respective Manufacturer Specifications:** Official data sheets from companies like Ortofon (specifying at 10 Hz) and Audio-Technica (specifying at 100 Hz) confirm the different industry standards.
