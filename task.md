# Current Fixes

## Issues to fix:
1. [x] Recently Visited avatars misaligned (patient/scan.tsx) - recentAvatarImage needs resizeMode:'cover' and overflow:'hidden' 
2. [x] Doctor registration avatar misaligned - avatarImage size mismatch (94 vs 100 container)
3. [x] Patient profile avatar misaligned - avatarContainer needs to ensure image fills
4. [x] Dashboard top avatar misaligned - topAvatar needs overflow:'hidden'
5. [x] Doctor profile avatar misaligned - already width/height 100%, looks ok but check
6. [x] Analytics weekly chart: "30" label drowning in tall bar - value above bar gets clipped/hidden when bar is tall. Need to show value ABOVE the bar always
7. [x] Registration: "Clinic Address" header + "CLINIC ADDRESS" label redundant - remove the label, keep just the section header
8. [x] Registration: too much empty space at bottom (height: 100 spacer)
9. [x] QR page: box too big, buttons too far down, make Download/Share functional, merge if same
