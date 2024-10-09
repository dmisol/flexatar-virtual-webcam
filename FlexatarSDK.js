class FlexatarAnimator {
    constructor(token) {
        this.tok = token
        this.renderer = new Renderer()
    }

    // returns the list of flexatars
    availableFlexatars() {

    }

    // returns preview image and name 
    preview(ftar) {

    }

    // accepts a list of either single or couple flexatars
    // also downloads flexatars from the cloud
    // continuous rendering is ensured
    // models are updated when downloading in finished
    useFlexatars(ftars) {
        this.renderer.useFlexatars(ftars)
    }

    useEffect(effect) {
        this.renderer.useEffect(effect)
    }

    // starts a+v streaming from the input audio
    stream(audioIn) {

    }
    // free gpu resources
    destroy() {
        this.renderer.destroy()
    }
}

const ModeMix = 0
const ModeMorph = 1
const ModeHybrid = 2

class Effect {

    constructor(fn) {
        this.fn = fn // fn(float seconds) int Mode, float Parameter
        // function fn(time<in seconds>){
        //     return Mode, Parameter
        //} 
    }

    static mix(mixWeight) {

    }

    static morph(duration) {

    }

    static hybrid(duration) {

    }
}
