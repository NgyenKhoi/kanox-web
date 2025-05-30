package controller;

import entity.Page;
import service.PageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pages")
public class PageController {
    
    @Autowired
    private PageService pageService;
    
    @GetMapping
    public List<Page> getAllPages() {
        return pageService.getAllPages();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Page> getPageById(@PathVariable Integer id) {
        Optional<Page> page = pageService.getPageById(id);
        return page.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Page createPage(@RequestBody Page page) {
        return pageService.createPage(page);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Page> updatePage(@PathVariable Integer id, @RequestBody Page pageDetails) {
        Page updatedPage = pageService.updatePage(id, pageDetails);
        if (updatedPage != null) {
            return ResponseEntity.ok(updatedPage);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable Integer id) {
        pageService.deletePage(id);
        return ResponseEntity.ok().build();
    }
} 