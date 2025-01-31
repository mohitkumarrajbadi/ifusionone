type FrameAction = 'CLOSE' | 'MINIMIZE' | 'MAXIMIZE';

interface IpcChannels {
    sendFrameAction: (action: FrameAction) => void;
}
