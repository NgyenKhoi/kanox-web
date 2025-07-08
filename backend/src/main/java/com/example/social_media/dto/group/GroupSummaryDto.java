package com.example.social_media.dto.group;

public class GroupSummaryDto {
    private Integer id;
    private String name;
    private Integer members;
    private String status;
    private String type;
    private String created;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMembers() {
        return members;
    }

    public void setMembers(Integer members) {
        this.members = members;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public GroupSummaryDto(Integer id, String name, Integer members, String status, String type, String created) {
        this.id = id;
        this.name = name;
        this.members = members;
        this.status = status;
        this.type = type;
        this.created = created;
    }


}
