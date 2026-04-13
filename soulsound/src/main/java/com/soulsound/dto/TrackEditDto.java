package com.soulsound.dto;

import com.soulsound.entity.TrackPrivacy;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;

public class TrackEditDto {

    @NotBlank @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String artist;

    @Size(max = 100)
    private String genre;

    private String description;

    private TrackPrivacy privacy;

    /** Thay file nhạc mới (giữ nguyên metadata nếu null/empty) */
    private MultipartFile newAudioFile;

    /** Thay thumbnail mới (giữ nguyên nếu null/empty) */
    private MultipartFile newThumbnailFile;

    // Getters & Setters
    public String        getTitle()                          { return title; }
    public void          setTitle(String v)                  { this.title = v; }
    public String        getArtist()                         { return artist; }
    public void          setArtist(String v)                 { this.artist = v; }
    public String        getGenre()                          { return genre; }
    public void          setGenre(String v)                  { this.genre = v; }
    public String        getDescription()                    { return description; }
    public void          setDescription(String v)            { this.description = v; }
    public TrackPrivacy  getPrivacy()                        { return privacy; }
    public void          setPrivacy(TrackPrivacy v)          { this.privacy = v; }
    public MultipartFile getNewAudioFile()                   { return newAudioFile; }
    public void          setNewAudioFile(MultipartFile f)    { this.newAudioFile = f; }
    public MultipartFile getNewThumbnailFile()               { return newThumbnailFile; }
    public void          setNewThumbnailFile(MultipartFile f){ this.newThumbnailFile = f; }
}