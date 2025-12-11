package com.example.smartdoc.controller;

import com.example.smartdoc.model.InvoiceData;
import com.example.smartdoc.model.User;
import com.example.smartdoc.repository.InvoiceRepository;
import com.example.smartdoc.utils.LinearRegressionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.smartdoc.service.DeepSeekService;
import com.example.smartdoc.utils.KMeansUtil;
import java.time.LocalDate;

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

    @Autowired
    private DeepSeekService deepSeekService;

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

    // 新增：获取知识图谱数据
    @GetMapping("/graph")
    public Map<String, Object> getKnowledgeGraph(@RequestHeader("Authorization") String token) {
        User user = UserController.tokenMap.get(token);
        if (user == null) return Map.of("code", 401);

        // 1. 查出该用户所有数据
        List<InvoiceData> list = invoiceRepository.findByUserIdOrderByIdDesc(user.getId());

        // 2. 构建图谱结构
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> links = new ArrayList<>();

        // 辅助集合去重
        List<String> addedCategories = new ArrayList<>();
        List<String> addedMerchants = new ArrayList<>();

        // A. 添加根节点 (用户自己)
        Map<String, Object> rootNode = new HashMap<>();
        rootNode.put("id", "ROOT");
        rootNode.put("name", user.getNickname());
        rootNode.put("symbolSize", 60); // 根节点最大
        rootNode.put("category", 0);    // 颜色分组索引
        nodes.add(rootNode);

        // B. 遍历数据构建 分类节点 和 商户节点
        int categoryIndex = 1; // 颜色分组

        // 统计每个分类的总金额，用于决定节点大小
        Map<String, Double> categoryAmountMap = new HashMap<>();
        // 统计每个商户的总金额
        Map<String, Double> merchantAmountMap = new HashMap<>();

        for (InvoiceData item : list) {
            categoryAmountMap.merge(item.getCategory(), item.getAmount(), Double::sum);
            merchantAmountMap.merge(item.getMerchantName(), item.getAmount(), Double::sum);
        }

        // C. 生成节点和连线
        for (InvoiceData item : list) {
            String cat = item.getCategory();
            String merch = item.getMerchantName();

            // 1. 处理分类节点 (Level 1)
            if (!addedCategories.contains(cat)) {
                Map<String, Object> catNode = new HashMap<>();
                catNode.put("id", "CAT_" + cat);
                catNode.put("name", cat);
                // 节点大小跟金额挂钩 (基础大小20 + 金额缩放)
                double size = 20 + Math.log(categoryAmountMap.get(cat) + 1) * 5;
                catNode.put("symbolSize", Math.min(size, 50));
                catNode.put("category", 1);
                nodes.add(catNode);
                addedCategories.add(cat);

                // 连线：用户 -> 分类
                Map<String, Object> link = new HashMap<>();
                link.put("source", "ROOT");
                link.put("target", "CAT_" + cat);
                links.add(link);
            }

            // 2. 处理商户节点 (Level 2)
            if (!addedMerchants.contains(merch)) {
                Map<String, Object> merchNode = new HashMap<>();
                merchNode.put("id", "MER_" + merch);
                merchNode.put("name", merch);
                double size = 10 + Math.log(merchantAmountMap.get(merch) + 1) * 3;
                merchNode.put("symbolSize", Math.min(size, 30));
                merchNode.put("category", 2);
                nodes.add(merchNode);
                addedMerchants.add(merch);

                // 连线：分类 -> 商户
                Map<String, Object> link = new HashMap<>();
                link.put("source", "CAT_" + cat);
                link.put("target", "MER_" + merch);
                links.add(link);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("links", links);

        return Map.of("code", 200, "data", result);
    }

    // 新增：K-Means 聚类分析接口
    @GetMapping("/clustering")
    public Map<String, Object> getClustering(@RequestHeader("Authorization") String token) {
        User user = UserController.tokenMap.get(token);
        if (user == null) return Map.of("code", 401);

        List<InvoiceData> list = invoiceRepository.findByUserIdOrderByIdDesc(user.getId());

        // 1. 数据预处理：转为二维点
        // X轴：每月的几号 (1-31)，反映时间习惯
        // Y轴：金额，反映消费水平
        List<KMeansUtil.Point> points = new ArrayList<>();
        for (InvoiceData item : list) {
            try {
                // 解析日期 "2025-12-09" -> 9
                int day = LocalDate.parse(item.getDate()).getDayOfMonth();
                points.add(new KMeansUtil.Point(day, item.getAmount(), -1));
            } catch (Exception e) {}
        }

        // 2. 执行算法 (假设聚为 3 类)
        KMeansUtil.ClusterResult result = KMeansUtil.fit(points, 3, 100);

        return Map.of("code", 200, "data", result);
    }

    // 2. 新增：获取 AI 对聚类结果的分析报告
    @GetMapping("/analyze-clustering")
    public Map<String, Object> analyzeClustering(@RequestHeader("Authorization") String token) {
        User user = UserController.tokenMap.get(token);
        if (user == null) return Map.of("code", 401);

        // A. 先重新计算一遍聚类 (为了获取中心点数据)
        List<InvoiceData> list = invoiceRepository.findByUserIdOrderByIdDesc(user.getId());
        List<KMeansUtil.Point> points = new ArrayList<>();
        for (InvoiceData item : list) {
            try {
                int day = java.time.LocalDate.parse(item.getDate()).getDayOfMonth();
                points.add(new KMeansUtil.Point(day, item.getAmount(), -1));
            } catch (Exception e) {}
        }

        if (points.size() < 3) {
            return Map.of("code", 200, "data", "数据量不足，暂无法生成聚类分析报告。请多上传几张票据。");
        }

        KMeansUtil.ClusterResult result = KMeansUtil.fit(points, 3, 50);

        // B. 构建 Prompt，告诉 AI 三个群体的特征
        StringBuilder dataDesc = new StringBuilder();
        List<KMeansUtil.Point> centers = result.getCentroids();

        for (int i = 0; i < centers.size(); i++) {
            KMeansUtil.Point p = centers.get(i);
            dataDesc.append(String.format("- 群体%d特征: 平均发生在每月 %d 号左右，平均金额约 %.2f 元。\n",
                    i + 1, (int)p.getX(), p.getY()));
        }

        String systemPrompt = "你是一个专业的财务数据分析师。请根据用户的消费聚类中心数据，用通俗易懂的语言分析用户的消费习惯。";
        String userPrompt = String.format("""
            我的消费数据被 K-Means 算法聚类为以下 3 类：
            %s
            
            请帮我分析：
            1. 哪一类可能是日常餐饮/交通？
            2. 哪一类可能是房租/房贷或固定大额支出？
            3. 哪一类可能是突发性消费？
            4. 给出一句简短的理财建议。
            
            请直接给出分析结果，不要啰嗦，使用 Markdown 格式。
            """, dataDesc.toString());

        // C. 调用 AI
        String analysis = deepSeekService.callAi(systemPrompt, userPrompt);

        return Map.of("code", 200, "data", analysis);
    }
}