package service;

import entity.Page;
import repository.PageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PageService {
    
    @Autowired
    private PageRepository pageRepository;
    
    public List<Page> getAllPages() {
        return pageRepository.findAll();
    }
    
    public Optional<Page> getPageById(Integer id) {
        return pageRepository.findById(id);
    }
    
    public Page createPage(Page page) {
        return pageRepository.save(page);
    }
    
    public Page updatePage(Integer id, Page pageDetails) {
        Optional<Page> page = pageRepository.findById(id);
        if (page.isPresent()) {
            Page existingPage = page.get();
            existingPage.setName(pageDetails.getName());
            existingPage.setDescription(pageDetails.getDescription());
            existingPage.setStatus(pageDetails.getStatus());
            return pageRepository.save(existingPage);
        }
        return null;
    }
    
    public void deletePage(Integer id) {
        pageRepository.deleteById(id);
    }
} 