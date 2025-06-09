package com.example.social_media.document;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "user")
public class UserDocument {
    @Id
    private String id;

    private String email;
    private String username;
    @Field(type = FieldType.Text)
    private String displayName;
    private String phoneNumber;
    private String bio;
    private Short gender;

    public UserDocument() {}

    public UserDocument(String id, String email, String username, String displayName, String phoneNumber, String bio, Short gender) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.bio = bio;
        this.gender = gender;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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
