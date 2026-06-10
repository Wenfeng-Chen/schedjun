import { ASSISTANT_ASR_STREAM_URL } from '../constants/apiConfig';

export type AsrStreamMessage =
  | { type: 'ready' }
  | { type: 'final'; asrText: string }
  | { type: 'error'; message: string };

export interface AssistantAsrStreamSession {
  sendAudio: (base64: string) => void;
  finish: () => Promise<string>;
  close: () => void;
}

const WS_CONNECT_TIMEOUT_MS = 10000;
const ASR_FINISH_TIMEOUT_MS = 60000;

function parseMessage(raw: string): AsrStreamMessage | null {
  try {
    const parsed = JSON.parse(raw) as AsrStreamMessage;
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function openAssistantAsrStream(accessToken: string): Promise<AssistantAsrStreamSession> {
  return new Promise((resolve, reject) => {
    const url = `${ASSISTANT_ASR_STREAM_URL}?token=${encodeURIComponent(accessToken)}`;
    const ws = new WebSocket(url);

    let ready = false;
    let finished = false;
    let finishResolve: ((text: string) => void) | null = null;
    let finishReject: ((error: Error) => void) | null = null;

    const connectTimer = setTimeout(() => {
      if (!ready) {
        ws.close();
        reject(new Error('语音识别连接超时'));
      }
    }, WS_CONNECT_TIMEOUT_MS);

    const fail = (error: Error) => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(connectTimer);
      finishReject?.(error);
      finishReject = null;
      finishResolve = null;
      reject(error);
    };

    ws.onopen = () => {
      // wait for server ready
    };

    ws.onmessage = (event) => {
      const message = parseMessage(String(event.data));
      if (!message) {
        return;
      }

      if (message.type === 'ready') {
        ready = true;
        clearTimeout(connectTimer);
        resolve({
          sendAudio: (base64: string) => {
            if (ws.readyState === WebSocket.OPEN && !finished) {
              ws.send(JSON.stringify({ type: 'audio', data: base64 }));
            }
          },
          finish: () =>
            new Promise<string>((resolveFinal, rejectFinal) => {
              if (finished) {
                rejectFinal(new Error('语音识别已结束'));
                return;
              }
              finishResolve = resolveFinal;
              finishReject = rejectFinal;

              const finishTimer = setTimeout(() => {
                fail(new Error('语音识别超时'));
              }, ASR_FINISH_TIMEOUT_MS);

              const originalResolve = finishResolve;
              const originalReject = finishReject;
              finishResolve = (text) => {
                clearTimeout(finishTimer);
                originalResolve?.(text);
              };
              finishReject = (error) => {
                clearTimeout(finishTimer);
                originalReject?.(error);
              };

              ws.send(JSON.stringify({ type: 'end' }));
            }),
          close: () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
              ws.close();
            }
          },
        });
        return;
      }

      if (message.type === 'final') {
        finished = true;
        finishResolve?.(message.asrText);
        finishResolve = null;
        finishReject = null;
        ws.close();
        return;
      }

      if (message.type === 'error') {
        fail(new Error(message.message || '语音识别失败'));
        ws.close();
      }
    };

    ws.onerror = () => {
      fail(new Error('语音识别连接失败'));
    };

    ws.onclose = () => {
      if (!ready) {
        fail(new Error('语音识别连接已断开'));
        return;
      }
      if (!finished && finishReject) {
        fail(new Error('语音识别连接已断开'));
      }
    };
  });
}
