package com.flotilla.manager.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "card_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "card_name", nullable = false, length = 150)
    @Builder.Default
    private String cardName = "Tarjeta Flotilla TotalEnergies";

    @Column(name = "monthly_limit", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal monthlyLimit = new BigDecimal("10000.00");

    @Column(name = "cutoff_start_day", nullable = false)
    @Builder.Default
    private Integer cutoffStartDay = 29;

    @Column(name = "cutoff_end_day", nullable = false)
    @Builder.Default
    private Integer cutoffEndDay = 2;

    @Column(name = "recharge_day", nullable = false)
    @Builder.Default
    private Integer rechargeDay = 3;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "DOP";
}
