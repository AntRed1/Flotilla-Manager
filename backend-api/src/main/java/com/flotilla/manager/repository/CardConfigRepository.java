package com.flotilla.manager.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flotilla.manager.entity.CardConfig;

@Repository
public interface CardConfigRepository extends JpaRepository<CardConfig, Long> {

    Optional<CardConfig> findByUserId(Long userId);
}
