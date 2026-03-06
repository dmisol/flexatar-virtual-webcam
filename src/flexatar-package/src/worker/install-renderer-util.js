


export function postBuffersToWorker(url, worker,size) {
    let inputArrayBuffers
    if (typeof url === "string") {
        inputArrayBuffers = [
            fetch(url + "/flx_gl_static.p").then(response => response.arrayBuffer()),
            fetch(url + "/animation.bin").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/wav2mel/model.json").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/wav2mel/group1-shard1of3.bin").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/wav2mel/group1-shard2of3.bin").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/wav2mel/group1-shard3of3.bin").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/mel2phon/model.json").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/mel2phon/group1-shard1of1.bin").then(response => response.arrayBuffer()),
            fetch(url + "/speachnn/phon2avec/model.json").then(response => response.arrayBuffer()),
             fetch(url + "/speachnn/phon2avec/group1-shard1of1.bin").then(response => response.arrayBuffer()),
            fetch(url + "/calm_pattern.bin").then(response => response.arrayBuffer()),
            fetch(url + "/lively_pattern.bin").then(response => response.arrayBuffer()),
            fetch(url + "/silent_pattern.bin").then(response => response.arrayBuffer()),
        ]
    } else if (Array.isArray(url)) {
        // Array of URLs case
        inputArrayBuffers = url;
    }
    else {
        throw new Error("Invalid url parameter: must be a string or array of strings");
    }
    Promise.all(inputArrayBuffers).then(

        buffers => {
            console.log("worker buffers ready", buffers)

            worker.postMessage({
                initBuffers: [buffers[0], buffers[1], [buffers[10], buffers[11], buffers[12]]],
                nnBuffers: {
                    wav2mel: {
                        model: buffers[2],
                        shards: [buffers[3], buffers[4], buffers[5]]
                    },
                    mel2phon: {
                        model: buffers[6],
                        shards: [buffers[7]]
                        // url:buffers[3]
                    },
                    phon2avec: {
                        model: buffers[8],
                        shards: [buffers[9]]
                    },
                },
                size
            }, buffers)
        }
    ).catch((e) => {
        console.error("Error load worker resource", e)
    });

}