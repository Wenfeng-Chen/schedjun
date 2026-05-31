package com.schedjun.backend.service;

import com.schedjun.backend.client.PcmChunk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import ws.schild.jave.Encoder;
import ws.schild.jave.EncoderException;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class AudioTranscodeService {

    private static final Logger log = LoggerFactory.getLogger(AudioTranscodeService.class);
    private static final int TARGET_SAMPLE_RATE = 16000;

    public PcmChunk toPcm16Mono16k(byte[] audioBytes) {
        Path input = null;
        Path output = null;
        try {
            input = Files.createTempFile("schedjun-asr-in-", ".m4a");
            output = Files.createTempFile("schedjun-asr-out-", ".wav");
            Files.write(input, audioBytes);

            AudioAttributes audio = new AudioAttributes();
            audio.setCodec("pcm_s16le");
            audio.setChannels(1);
            audio.setSamplingRate(TARGET_SAMPLE_RATE);

            EncodingAttributes attrs = new EncodingAttributes();
            attrs.setOutputFormat("wav");
            attrs.setAudioAttributes(audio);

            new Encoder().encode(new MultimediaObject(input.toFile()), output.toFile(), attrs);

            byte[] wavBytes = Files.readAllBytes(output);
            PcmChunk chunk = extractWavPcm(wavBytes);
            log.info("m4a 转码完成: inputBytes={}, pcmBytes={}, sampleRate={}",
                    audioBytes.length, chunk.data().length, chunk.sampleRate());
            return chunk;
        } catch (EncoderException | IOException ex) {
            throw new IllegalArgumentException("音频转码失败，请重新录音: " + ex.getMessage(), ex);
        } finally {
            deleteQuietly(input);
            deleteQuietly(output);
        }
    }

    private PcmChunk extractWavPcm(byte[] wavBytes) {
        if (wavBytes.length < 12) {
            throw new IllegalArgumentException("转码后的 WAV 无效");
        }
        if (!(wavBytes[0] == 'R' && wavBytes[1] == 'I' && wavBytes[2] == 'F' && wavBytes[3] == 'F')) {
            throw new IllegalArgumentException("转码后的 WAV 无效");
        }

        int offset = 12;
        int sampleRate = TARGET_SAMPLE_RATE;
        while (offset + 8 <= wavBytes.length) {
            String chunkId = new String(wavBytes, offset, 4, StandardCharsets.US_ASCII);
            int chunkSize = ByteBuffer.wrap(wavBytes, offset + 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt();
            int chunkDataStart = offset + 8;

            if ("fmt ".equals(chunkId) && chunkDataStart + 8 <= wavBytes.length) {
                sampleRate = ByteBuffer.wrap(wavBytes, chunkDataStart + 4, 4)
                        .order(ByteOrder.LITTLE_ENDIAN)
                        .getInt();
            }

            if ("data".equals(chunkId)) {
                int dataLength = Math.min(chunkSize, wavBytes.length - chunkDataStart);
                byte[] pcm = new byte[dataLength];
                System.arraycopy(wavBytes, chunkDataStart, pcm, 0, dataLength);
                return new PcmChunk(pcm, sampleRate > 0 ? sampleRate : TARGET_SAMPLE_RATE);
            }

            offset = chunkDataStart + Math.max(chunkSize, 0);
            if (chunkSize % 2 == 1) {
                offset++;
            }
        }

        throw new IllegalArgumentException("转码后的 WAV 缺少音频数据");
    }

    private void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // temp cleanup best-effort
        }
    }
}
