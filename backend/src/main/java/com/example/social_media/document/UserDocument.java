package com.example.social_media.document;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "user")
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDocument {
    @Id
    private String id;
    private String username;
    @Field(type = FieldType.Keyword)
    private String displayName;
    private String bio;
    private Short gender;

    public UserDocument() {}

    public UserDocument(String id, String username, String displayName, String bio, Short gender) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.gender = gender;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }


    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Short getGender() {
        return gender;
    }

    public void setGender(Short gender) {
        this.gender = gender;
    }
}
