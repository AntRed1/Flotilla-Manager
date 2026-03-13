package com.flotilla.manager.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fuel_expenses", indexes = {
    @Index(name = "idx_expenses_user_cycle", columnList = "user_id,cycle_id"),
    @Index(name = "idx_expenses_date", columnList = "date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelExpense extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private GasStation station;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // ✅ Cambiado a LocalDateTime para guardar fecha + hora real del registro
    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    /**
     * Billing cycle in format YYYY-MM (e.g. "2026-03")
     */
    @Column(name = "cycle_id", nullable = false, length = 7)
    private String cycleId;

    @Column(name = "odometer")
    private Integer odometer;

    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * Stored filename of the uploaded receipt image
     */
    @Column(name = "receipt_image", length = 255)
    private String receiptImage;
}
