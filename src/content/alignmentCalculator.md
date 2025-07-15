### Quick Introduction

To get the best possible sound from your records, the stylus must sit at the exact right angle in the record groove, from the beginning to the end. Because most tonearms pivot, they travel in a slight arc across the record, creating a small angular error called "tracking error." This can cause distortion, especially on the inner grooves. This tool helps you minimize this error by calculating the precise setup adjustments for your specific tonearm and generating a custom protractor you can print and use.

***

#### In-Depth Explanation

**The Problem: Tracking Error**

When a master record is cut, the cutter head moves in a perfectly straight line across the record's radius. This means the cutting stylus is always at a perfect 90-degree angle (tangential) to the record groove. A standard pivoting tonearm, however, can only achieve this perfect angle at two specific points on the record. Everywhere else, the playback stylus will be slightly "askew" in the groove. This deviation from the perfect angle is the tracking error.

**The Consequence: Distortion**

When the stylus is not perfectly tangential to the groove, it cannot read the two groove walls (which represent the left and right audio channels) accurately and simultaneously. This creates a time difference between the channels and an inability to precisely trace the engraved waveform, resulting in audible distortion. The problem typically worsens towards the center of the record, as the grooves become shorter and the information is more compressed. This is why the last song on a record side can often sound worse or more strained.

**The Solution: Optimized Geometries**

Mathematicians and engineers like Löfgren, Baerwald, and Stevenson realized that while tracking error cannot be eliminated with a pivoting arm, it can be *optimized*. They developed mathematical formulas to calculate two "null points" on the record where the tracking error is exactly zero. By adjusting the tonearm's *overhang* (how far the stylus extends past the spindle) and *offset angle* (the angle of the cartridge in the headshell), one can strategically place these null points.

The different geometries (Baerwald, Löfgren, etc.) are simply different philosophies for where these null points should be placed to achieve the best compromise:

*   **Löfgren A (Baerwald):** Aims to keep the *average* distortion as low as possible across the entire record side. It balances the error between the beginning, middle, and end.
*   **Löfgren B:** Minimizes the *absolute maximum* distortion. The error may be slightly higher in the middle, but the highest peaks of distortion (often at the inner and outer grooves) will be lower than with Baerwald.
*   **Stevenson:** Focuses on eliminating distortion as close to the record's innermost groove as possible, where the risk of audible distortion is greatest. This comes at the expense of higher distortion at the beginning and middle of the record.

**How This Tool Helps You**

Calculating these geometries manually is complex. This tool does all the math for you. By entering your tonearm's pivot-to-spindle distance, it can calculate the exact values for overhang and offset angle for each geometry. More importantly, it can generate a printable protractor that is tailor-made for your specific tonearm, which is significantly more accurate than a generic, one-size-fits-all protractor.

<hr>

#### Full Technical Guide

For a deeper dive into the alignment formulas, tracking error charts, and a full FAQ, please open the full technical help document.

<button class="technical-help-link" onclick="window.triggerTechnicalHelp()">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path><path d="M12 18h.01"></path><path d="M12 15c-2.28 0-4-1.72-4-4s1.72-4 4-4 4 1.72 4 4-1.72 4-4 4z"></path></svg>
  Open Full Methodology & User Guide
</button>

<hr>

#### Sources and Further Reading

1.  **Jovanovic, V. M. (2022).** "New Analytical Results for Löfgren C Tonearm Alignment." *AES Journal Paper*. An advanced, modern analysis of tracking error, distortion (THD), and the precise formulas for overhang, offset, and null points for Löfgren geometries.
2.  **Löfgren, E. (1938).** "Über die bei der Wiedergabe von Schallplatten infolge des die Nadel führenden Armes auftretenden harmonischen Verzerrungen" (On the Nonlinear Distortion in the Reproduction of Phonograph Records Caused by the Tracking Arm). *Akustische Zeitschrift*, 3. The original academic paper that laid the mathematical foundation for modern alignment theory.
3.  **Baerwald, H.G. (1941).** "Analytic Treatment of Tracking Error and Notes on Pick-Up Design." *Journal of the Society of Motion Picture Engineers*, 37(6). The classic paper that defined what is now commonly known as the Baerwald geometry.
4.  **Stevenson, J.K. (1966).** "Pickup Arm Design." *Wireless World* (later *Electronics & Wireless World*), 72(1368). The article that first presented the Stevenson A alignment geometry.
5.  **Graves, D. & New, P.** "The Ins and Outs of Turntable Dynamics." *Linearaudio.net*. A comprehensive article covering wow, flutter, anti-skate, stylus friction, and other dynamic forces, providing excellent context for alignment principles. [Linearaudio Article](https://linearaudio.net/turntable-dynamics)
