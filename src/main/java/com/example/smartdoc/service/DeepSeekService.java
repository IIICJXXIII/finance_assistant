package com.example.smartdoc.service;

import cn.hutool.http.HttpRequest;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeepSeekService {

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.api.url}")
    private String apiUrl;

    public String callAi(String systemPrompt, String userMessage) {
        try {
            JSONObject body = new JSONObject();
            body.put("model", "deepseek-chat");
            body.put("temperature", 0.3); // 分析类任务温度低一点，更理性

            JSONArray messages = new JSONArray();
            messages.put(new JSONObject().put("role", "system").put("content", systemPrompt));
            messages.put(new JSONObject().put("role", "user").put("content", userMessage));
            body.put("messages", messages);

            String response = HttpRequest.post(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(body.toString())
                    .timeout(60000) // 60秒超时
                    .execute()
                    .body();

            JSONObject jsonResponse = new JSONObject(response);
            if (jsonResponse.has("error")) {
                return "AI 服务响应错误: " + jsonResponse.getJSONObject("error").getString("message");
            }

            return jsonResponse.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content");

        } catch (Exception e) {
            e.printStackTrace();
            return "分析服务暂时不可用";
        }
    }
}
