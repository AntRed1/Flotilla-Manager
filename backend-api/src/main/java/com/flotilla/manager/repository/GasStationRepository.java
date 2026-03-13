package com.flotilla.manager.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.flotilla.manager.entity.GasStation;

@Repository
public interface GasStationRepository extends JpaRepository<GasStation, Long> {

    // Estaciones globales del catálogo + estaciones propias del usuario
    @Query("SELECT s FROM GasStation s WHERE s.active = true AND (s.global = true OR s.user.id = :userId) ORDER BY s.zone ASC, s.name ASC")
    List<GasStation> findAvailableForUser(@Param("userId") Long userId);

    // Solo estaciones propias del usuario (para editar/eliminar)
    Optional<GasStation> findByIdAndUserId(Long id, Long userId);

    // Cualquier estación visible al usuario (global o propia) — para registrar gastos
    @Query("SELECT s FROM GasStation s WHERE s.id = :id AND s.active = true AND (s.global = true OR s.user.id = :userId)")
    Optional<GasStation> findByIdAndAvailableForUser(@Param("id") Long id, @Param("userId") Long userId);

    boolean existsByNameAndUserId(String name, Long userId);
}
