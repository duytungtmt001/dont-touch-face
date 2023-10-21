import './App.css';
import { Howl, Howler } from 'howler';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { useEffect, useRef } from 'react';
// import soundURL from './assets/tieng-bip.mp3';

// var sound = new Howl({
//     src: [soundURL],
// });

// sound.play();

const NOT_TOUCH_LABEL = "not_touch";
const TOUCHED_LABEL = "touched";
const TRAINING_TIMES = 50;

function App() {
    const videoRef = useRef();
    const classifier = useRef();
    const mobilenetModule = useRef();

    const init = async () => {
        await setupCamera();
        console.log("Setup Camera Success");

        classifier.current = knnClassifier.create();

        mobilenetModule.current = await mobilenet.load();

        console.log("Setup done");
        console.log("Không chạm tay lên mặt và bấm Train 1");
    }

    const setupCamera = () => {
        return new Promise((resolve, reject) => {
            navigator.getUserMedia = navigator.getUserMedia || 
                navigator.webkitGetUserMedia || 
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
                
            if(navigator.getUserMedia) {
                navigator.getUserMedia(
                    { video: true },
                    stream => {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', resolve);
                    },
                    error => reject(error)
                )
            } else {
                reject();
            }
        })
    }

    const train = async (label) => {
        for(let i = 0; i < TRAINING_TIMES; ++i) {
            console.log(`Progress ${parseInt((i+1) / TRAINING_TIMES *100)}%`);
            await training(label);
        }
    }

    const training = async (label) => {
        const embedding = mobilenetModule.current.infer(videoRef.current, true);

        classifier.current.addExample(embedding, label);
        await sleep(100);
    }

    const sleep = async (ms = 0) => {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    const run = async () => {
        const embedding = mobilenetModule.current.infer(videoRef.current, true);

        const result  = await classifier.current.predictClass(embedding);

        console.log('Label: ', result.label);
        console.log('Confidences: ', result.confidences);

        await sleep(200);
        
        run();
    }

    useEffect(() => {
        init();

        // Cleanup function
        return () => {

        }
    }, [])

    return (
        <div className="main">
            <video className="video" autoPlay ref={videoRef} />

            <div className="control">
                <button className="btn" onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
                <button className="btn" onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
                <button className="btn" onClick={() => run()}>Run</button>
            </div>
        </div>
    );
}

export default App;
