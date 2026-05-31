package com.schedjun.backend.service;

import com.schedjun.backend.client.IflytekAsrClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AsrService {

    @Autowired
    private IflytekAsrClient iflytekAsrClient;

    public String transcribe(byte[] audioBytes, String format, int sampleRate, String language) {
        return iflytekAsrClient.transcribe(audioBytes, format, sampleRate, language);
    }
}
