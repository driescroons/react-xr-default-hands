codesandbox for testing:
<https://codesandbox.io/s/basic-demo-forked-ilnxv?file=/src/App.js>

- instead of checking middle of thumb and index, check if both fingers are colliding on the inside with the block
- custom hand model loader
- X apply lerping to rotation hand. it moves to the position instantly, but not the rotation.
- ? store initial transformation, can we do something with it? but then we can't move fingers
- X check if we're making a grabbing motion / releasing motion
- problem if you go back into presenting mode, it prefers controllers intead of hand tracking?
- change color when grabbing the block for the demo
- use plockle background & multiple blocks with plockle colors
- upgrading react to experimental for concurrent support
- X change color when grabbing
- X change background to something more easy on the eyes
- X put both models and iteracting in 1 ref object.

I've decided to open source my hand tracking module that I've built for plockle.com.

It supports grabbing geometries (), custom models ()
I still need to check what could fit in react-xr but for the time being, this could be used as an example!
Needs some performance optimisations, but feel free to contribute!
