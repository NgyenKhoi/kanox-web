package dao;

import entity.Page;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
@Transactional
public class PageDAO {

    @PersistenceContext
    private EntityManager entityManager;

    public Page save(Page page) {
        if (page.getId() == null) {
            // Set default values for new page
            page.setCreatedAt(Instant.now());
            page.setStatus(true);
            entityManager.persist(page);
            return page;
        } else {
            return entityManager.merge(page);
        }
    }

    public Page findById(Integer id) {
        return entityManager.find(Page.class, id);
    }

    public List<Page> findAll() {
        return entityManager.createQuery("SELECT p FROM Page p", Page.class).getResultList();
    }

    public void deleteById(Integer id) {
        Page page = entityManager.find(Page.class, id);
        if (page != null) {
            entityManager.remove(page);
        }
    }

    public List<Page> findByName(String name) {
        return entityManager.createQuery(
                "SELECT p FROM Page p WHERE p.name LIKE :name", Page.class)
                .setParameter("name", "%" + name + "%")
                .getResultList();
    }

    public List<Page> findByStatus(Boolean status) {
        return entityManager.createQuery(
                "SELECT p FROM Page p WHERE p.status = :status", Page.class)
                .setParameter("status", status)
                .getResultList();
    }

    public List<Page> findByDescription(String description) {
        return entityManager.createQuery(
                "SELECT p FROM Page p WHERE p.description LIKE :description", Page.class)
                .setParameter("description", "%" + description + "%")
                .getResultList();
    }

    public List<Page> findByCreatedAtAfter(Instant date) {
        return entityManager.createQuery(
                "SELECT p FROM Page p WHERE p.createdAt > :date", Page.class)
                .setParameter("date", date)
                .getResultList();
    }

    public List<Page> findByCreatedAtBefore(Instant date) {
        return entityManager.createQuery(
                "SELECT p FROM Page p WHERE p.createdAt < :date", Page.class)
                .setParameter("date", date)
                .getResultList();
    }
} 