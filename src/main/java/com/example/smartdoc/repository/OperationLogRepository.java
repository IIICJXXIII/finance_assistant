package com.example.smartdoc.repository;

import com.example.smartdoc.model.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {
    List<OperationLog> findByUserIdOrderByIdDesc(Long userId);
}
