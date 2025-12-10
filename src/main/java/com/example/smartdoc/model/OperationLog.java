package com.example.smartdoc.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sys_operation_log")
public class OperationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String operation;
    private String detail;
    private String ipAddress;
    private LocalDateTime createTime;

    @PrePersist
    public void prePersist() { this.createTime = LocalDateTime.now(); }

    // 构造函数方便调用
    public OperationLog() {}
    public OperationLog(Long userId, String op, String detail) {
        this.userId = userId;
        this.operation = op;
        this.detail = detail;
    }
}
