package com.example.social_media.document;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)

@Document(indexName = "groups")
public class GroupDocument {
    @Id
    private String id;
    private Integer ownerId;
    @Field(type = FieldType.Text)
    private String name;
    private String description;
    private List<String> memberNames;
    private Boolean status;

    public GroupDocument() {
    }
    public GroupDocument(String id, Integer ownerId, String name, String description, List<String> memberNames,  Boolean status) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.description = description;
        this.memberNames = memberNames;
        this.status = status;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }


    public List<String> getMemberNames() {
        return memberNames;
    }

    public void setMemberNames(List<String> memberNames) {
        this.memberNames = memberNames;
    }
}
