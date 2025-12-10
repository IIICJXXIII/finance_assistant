package com.example.smartdoc.controller;

import com.example.smartdoc.model.User;
import com.example.smartdoc.repository.InvoiceRepository;
import com.example.smartdoc.utils.LinearRegressionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
public class StatsController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @GetMapping("/trend")
    public Map<String, Object> getTrendPrediction(@RequestHeader("Authorization") String token) {
        User user = UserController.tokenMap.get(token);
        if (user == null) return Map.of("code", 401);

        // 1. 获取数据库真实数据
        List<Object[]> rawData = invoiceRepository.findMonthlyStatsByUserId(user.getId());

        List<String> months = new ArrayList<>();
        List<Double> amounts = new ArrayList<>();

        for (Object[] row : rawData) {
            months.add(row[0].toString()); // 月份
            amounts.add(Double.parseDouble(row[1].toString())); // 金额
        }

        // 2. 调用算法进行预测
        Double nextMonthPrediction = 0.0;
        String nextMonthLabel = "下月预测";

        if (!amounts.isEmpty()) {
            nextMonthPrediction = LinearRegressionUtil.predictNext(amounts);
            // 简单计算下个月份的字符串 (这里简化处理，直接叫"预测值")
        }

        // 3. 封装返回结果
        Map<String, Object> data = new HashMap<>();
        data.put("months", months);         // x轴: ["2025-01", "2025-02"...]
        data.put("amounts", amounts);       // y轴: [1000, 1200...]
        data.put("prediction", nextMonthPrediction); // 预测下个月的值

        return Map.of("code", 200, "data", data);
    }
}