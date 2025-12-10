package com.example.smartdoc.service;

import com.baidu.aip.ocr.AipOcr;
import com.example.smartdoc.model.InvoiceData;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrService {

    @Value("${baidu.ocr.app-id}")
    private String appId;
    @Value("${baidu.ocr.api-key}")
    private String apiKey;
    @Value("${baidu.ocr.secret-key}")
    private String secretKey;

    private AipOcr client;

    @PostConstruct
    public void init() {
        client = new AipOcr(appId, apiKey, secretKey);
        client.setConnectionTimeoutInMillis(2000);
        client.setSocketTimeoutInMillis(60000);
    }

    public InvoiceData processDocument(MultipartFile file) throws IOException {
        // 1. PDF 转图片
        byte[] fileBytes;
        String fileName = file.getOriginalFilename();
        if (fileName != null && fileName.toLowerCase().endsWith(".pdf")) {
            fileBytes = convertPdfToJpg(file.getBytes());
        } else {
            fileBytes = file.getBytes();
        }

        // 2. 调用智能财务票据识别
        return callSmartFinanceOcr(fileBytes);
    }

    /**
     * 核心：调用百度[智能财务票据识别]接口
     */
    private InvoiceData callSmartFinanceOcr(byte[] imageBytes) {
        try {
            HashMap<String, Object> options = new HashMap<>();
            options.put("probability", "true"); // 返回置信度

            // API: multiple_invoice
            JSONObject res = client.multipleInvoice(imageBytes, options);

            // 调试用：打印原始返回 (开发时可打开)
            // System.out.println("🤖 OCR原始返回: " + res.toString());

            if (res.has("words_result")) {
                JSONArray results = res.getJSONArray("words_result");
                if (results.length() == 0) return null;

                // 目前系统设计为单张处理，所以我们取【第一个】识别到的票据
                // 如果后续想做批量导入，可以在这里循环处理 results
                JSONObject bestTicket = results.getJSONObject(0);
                String type = bestTicket.optString("type", "");
                JSONObject content = bestTicket.getJSONObject("result");

                InvoiceData data = new InvoiceData();
                data.setRawImageUrl("memory_image"); // 占位

                // 根据票据类型进行不同的字段映射
                switch (type) {
                    case "vat_invoice": // 增值税发票
                        parseVatInvoice(content, data);
                        break;
                    case "taxi_receipt": // 出租车票
                        parseTaxiReceipt(content, data);
                        break;
                    case "train_ticket": // 火车票
                        parseTrainTicket(content, data);
                        break;
                    case "quota_invoice": // 定额发票
                        parseQuotaInvoice(content, data);
                        break;
                    case "air_ticket": // 飞机行程单
                        parseAirTicket(content, data);
                        break;
                    default:
                        // 其他类型兜底处理
                        data.setMerchantName("未知票据类型: " + type);
                }

                // 统一后处理：日期格式化、分类补全
                postProcess(data);

                return data;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // --- 1. 增值税发票解析 ---
    private void parseVatInvoice(JSONObject r, InvoiceData data) {
        data.setMerchantName(getValue(r, "SellerName"));
        data.setAmount(getDouble(r, "AmountInFiguers", "TotalAmount")); // 优先取不含税，没有则取合计
        data.setDate(getValue(r, "InvoiceDate"));
        data.setInvoiceCode(getValue(r, "InvoiceNum")); // 优先存号码
        if (data.getInvoiceCode() == null) data.setInvoiceCode(getValue(r, "InvoiceCode"));

        // 项目名称：取第一行商品
        String item = getValue(r, "CommodityName");
        if (item == null) item = "办公用品/服务费";
        data.setItemName(item);

        // 分类推断
        String type = getValue(r, "InvoiceType");
        if (type != null && type.contains("通行费")) data.setCategory("交通出行");
    }

    // --- 2. 出租车票解析 ---
    private void parseTaxiReceipt(JSONObject r, InvoiceData data) {
        data.setCategory("交通出行");
        data.setItemName("出租车费");
        data.setMerchantName("出租车 " + getValue(r, "TaxiNum")); // 商户名存车牌号
        data.setAmount(getDouble(r, "TotalFare", "Fare"));
        data.setDate(getValue(r, "Date"));
        data.setInvoiceCode(getValue(r, "InvoiceCode"));
    }

    // --- 3. 火车票解析 ---
    private void parseTrainTicket(JSONObject r, InvoiceData data) {
        data.setCategory("交通出行");
        String trainNum = getValue(r, "train_num");
        String start = getValue(r, "starting_station");
        String end = getValue(r, "destination_station");
        data.setItemName("火车票 " + (trainNum != null ? trainNum : "") + " " + start + "-" + end);
        data.setMerchantName("铁路客运");
        data.setAmount(getDouble(r, "ticket_rates"));
        data.setDate(getValue(r, "date"));
        data.setInvoiceCode(getValue(r, "ticket_num"));
    }

    // --- 4. 定额发票解析 ---
    private void parseQuotaInvoice(JSONObject r, InvoiceData data) {
        data.setCategory("餐饮美食"); // 定额发票多为餐饮，先默认
        data.setAmount(getDouble(r, "invoice_rate", "invoice_rate_in_figure"));
        data.setInvoiceCode(getValue(r, "invoice_number"));
        data.setMerchantName("定额发票商户");
        data.setItemName("定额消费");
    }

    // --- 5. 飞机票解析 ---
    private void parseAirTicket(JSONObject r, InvoiceData data) {
        data.setCategory("交通出行");
        data.setMerchantName(getValue(r, "carrier")); // 承运人，如中国国航
        data.setAmount(getDouble(r, "ticket_rates")); // 合计金额
        data.setDate(getValue(r, "date"));
        String flight = getValue(r, "flight");
        String start = getValue(r, "starting_station");
        String end = getValue(r, "destination_station");
        data.setItemName("机票 " + (flight!=null?flight:"") + " " + start + "-" + end);
    }

    // --- 工具方法：提取百度API这种特定结构的字符串 ---
    // 结构通常是: "Key": [{"word": "实际值", ...}]
    private String getValue(JSONObject obj, String key) {
        if (obj == null || !obj.has(key)) return null;
        JSONArray arr = obj.getJSONArray(key);
        if (arr.length() > 0) {
            return arr.getJSONObject(0).optString("word", null);
        }
        return null;
    }

    // 工具方法：提取金额 (支持多个备选字段)
    private Double getDouble(JSONObject obj, String... keys) {
        for (String key : keys) {
            String val = getValue(obj, key);
            if (val != null) {
                try {
                    // 去掉 "￥", "元" 等非数字字符
                    String numStr = val.replaceAll("[^0-9.]", "");
                    return Double.parseDouble(numStr);
                } catch (Exception e) {}
            }
        }
        return 0.0;
    }

    // --- 后处理：清洗数据 ---
    private void postProcess(InvoiceData data) {
        // 1. 规范化日期格式 -> YYYY-MM-DD
        if (data.getDate() != null) {
            String d = data.getDate();
            // 处理 "2025年05月20日" -> "2025-05-20"
            d = d.replaceAll("[年月/.]", "-").replace("日", "");
            // 简单的正则提取 YYYY-MM-DD
            Matcher m = Pattern.compile("\\d{4}-\\d{1,2}-\\d{1,2}").matcher(d);
            if (m.find()) {
                data.setDate(m.group());
            }
        }

        // 2. 智能分类补全 (如果前面没定好分类)
        if (data.getCategory() == null || data.getCategory().equals("其他")) {
            String fullText = (data.getItemName() + data.getMerchantName()).toLowerCase();
            if (fullText.contains("餐饮") || fullText.contains("美食") || fullText.contains("星巴克"))
                data.setCategory("餐饮美食");
            else if (fullText.contains("交通") || fullText.contains("车") || fullText.contains("航") || fullText.contains("油"))
                data.setCategory("交通出行");
            else if (fullText.contains("办公") || fullText.contains("纸") || fullText.contains("笔"))
                data.setCategory("办公耗材");
            else if (fullText.contains("通信") || fullText.contains("网") || fullText.contains("信"))
                data.setCategory("通讯网络");
            else if (fullText.contains("电子") || fullText.contains("电脑") || fullText.contains("手机"))
                data.setCategory("电子设备");
            else
                data.setCategory("其他");
        }
    }

    private byte[] convertPdfToJpg(byte[] pdfBytes) throws IOException {
        try (PDDocument document = PDDocument.load(pdfBytes);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImage(0, 2.0f, ImageType.RGB);
            ImageIO.write(image, "jpg", baos);
            return baos.toByteArray();
        }
    }
}