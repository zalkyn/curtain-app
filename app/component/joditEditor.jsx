import React, { useState, useRef, useMemo } from 'react';

const JoditEditor = React.lazy(() => import('jodit-react'));

function JoditEditorUI({ content, setContent, showImage = true, placeholder = "" }) {
    const editor = useRef(null);

    const config = useMemo(
        () => ({
            readonly: false, // Allow content editing
            placeholder: placeholder || 'Start typing...',
            toolbar: [
                [{ 'header': '1' }, { 'header': '2' }, { 'header': '3' }, { 'header': '4' }, { 'header': '5' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline'],
                [{ 'align': [] }],
                ['link'],
                ['image'], // Only keep the image option for upload
                // Remove 'file' and 'video' upload buttons entirely
            ],
            uploader: {
                insertImageAsBase64URI: true, // Insert the image as base64 directly into the editor
                accept: 'image/jpg,image/png,image/webp,image/jpeg', // Restrict file types to images only
                // Handle image upload (insert it as base64)
                handleFileUpload: (file) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // Insert the image as base64 into the editor
                            editor.current?.insertImage(e.target.result);
                        };
                        reader.readAsDataURL(file); // Read the image file as a base64 string
                    } else {
                        alert('Only images are allowed.');
                    }
                },
            },
        }),
        [placeholder]
    );

    const handleChange = (value) => {
        setContent(value);
    };

    return (
        <JoditEditor
            ref={editor}
            value={content}
            config={config}
            tabIndex={1} // tabIndex of textarea
            onBlur={(newContent) => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
            onChange={handleChange}
        />
    );
}

export default JoditEditorUI;
