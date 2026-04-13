package com.soulsound.dto;

import com.soulsound.entity.TrackPrivacy;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;

public class TrackUploadDto {

    @NotBlank(message = "Tên bài hát không được để trống")
    @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String artist;

    @Size(max = 100)
    private String genre;

    private String description;

    private TrackPrivacy privacy = TrackPrivacy.PUBLIC;

    // File fields (không validate ở đây — validate trong Service)
    private MultipartFile audioFile;
    private MultipartFile thumbnailFile;

    // Getters & Setters
    public String       getTitle()                           { return title; }
    public void         setTitle(String title)               { this.title = title; }
    public String       getArtist()                          { return artist; }
    public void         setArtist(String artist)             { this.artist = artist; }
    public String       getGenre()                           { return genre; }
    public void         setGenre(String genre)               { this.genre = genre; }
    public String       getDescription()                     { return description; }
    public void         setDescription(String description)   { this.description = description; }
    public TrackPrivacy getPrivacy()                         { return privacy; }
    public void         setPrivacy(TrackPrivacy privacy)     { this.privacy = privacy; }
    public MultipartFile getAudioFile()                      { return audioFile; }
    public void          setAudioFile(MultipartFile f)       { this.audioFile = f; }
    public MultipartFile getThumbnailFile()                  { return thumbnailFile; }
    public void          setThumbnailFile(MultipartFile f)   { this.thumbnailFile = f; }
}