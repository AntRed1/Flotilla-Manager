package com.flotilla.manager.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.flotilla.manager.entity.FuelExpense;

@Repository
public interface FuelExpenseRepository extends JpaRepository<FuelExpense, Long> {

    Optional<FuelExpense> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FuelExpense e WHERE e.user.id = :userId AND e.cycleId = :cycleId")
    BigDecimal sumAmountByUserIdAndCycleId(@Param("userId") Long userId, @Param("cycleId") String cycleId);

    @Query("SELECT COUNT(e) FROM FuelExpense e WHERE e.user.id = :userId AND e.cycleId = :cycleId")
    long countByUserIdAndCycleId(@Param("userId") Long userId, @Param("cycleId") String cycleId);

    @Query("SELECT e FROM FuelExpense e LEFT JOIN FETCH e.station WHERE e.user.id = :userId AND e.cycleId = :cycleId ORDER BY e.date DESC, e.createdAt DESC")
    List<FuelExpense> findByUserIdAndCycleIdWithStation(
            @Param("userId") Long userId,
            @Param("cycleId") String cycleId);

    @Query("SELECT e FROM FuelExpense e LEFT JOIN FETCH e.station WHERE e.user.id = :userId ORDER BY e.date DESC, e.createdAt DESC")
    List<FuelExpense> findAllByUserIdWithStation(@Param("userId") Long userId);

    List<FuelExpense> findByUserIdAndCycleIdOrderByDateDesc(Long userId, String cycleId);

    /**
     * Todos los gastos del usuario ordenados por fecha DESC. Hace eager fetch
     * de station para evitar N+1 en analítica.
     */
    @Query("SELECT e FROM FuelExpense e LEFT JOIN FETCH e.station WHERE e.user.id = :userId ORDER BY e.date DESC")
    List<FuelExpense> findByUserIdOrderByDateDesc(@Param("userId") Long userId);
}
