class FlexatarAnimator {
    constructor(tok){
        this.tok = tok
        this.renderer = new Renderer()
    }

    // returns the list of flexatars
    get availableFlexatars(){

    }

    // returns preview image and name 
    get preview(ftar){

    }

    // accepts a list of either single or couple flexatars
    useFlexatars(ftars){
        this.renderer.useFlexatars(ftars)
    }

    useEffect(effect){
        this.renderer.useEffect(effect)
    }

    // starts a+v streaming from the input audio
    get stream(audioIn){
        
    }
    // free gpu resources
    destroy(){
        this.renderer.destroy()
    }
}

const ModeMix = 0
const ModeMorph = 1
const ModeHybrid = 2

class Effect{
    
    constructor(fn){
        this.fn = fn // fn(float seconds) int Mode, float Parameter
        // function fn(time<in seconds>){
        //     return Mode, Parameter
        //} 
    }

    static get mix(mixWeight){

    }

    static get morph(duration){

    }

    static get hybrid(duration){

    }
}