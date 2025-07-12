// import React, { Suspense, useState } from 'react';

// const ReactQuill = React.lazy(() => import('react-quill'));


// function TextEditor({ content, setContent, showImage = true }) {
//     // const [content, setContent] = useState('');

//     let imageLink = ['link', 'image'];
//     if (!showImage) {
//         imageLink = ['link']
//     }

//     const modules = {
//         toolbar: [
//             [{ 'header': '1' }, { 'header': '2' }],
//             [{ 'list': 'ordered' }, { 'list': 'bullet' }],
//             ['bold', 'italic', 'underline'],
//             [{ 'align': [] }],
//             [...imageLink]
//         ],
//     };

//     const handleChange = (value) => {
//         setContent(value);
//     };


//     return (
//         <Suspense>
//             <ReactQuill
//                 value={content}
//                 onChange={handleChange}
//                 modules={modules} // Enable custom toolbar
//                 theme="snow" // Use the "snow" theme
//             />
//         </Suspense>
//     );
// }

// export default TextEditor;



import React, { Suspense, useEffect, useState } from 'react';

const ReactQuill = React.lazy(() => import('react-quill'));

function TextEditor({ content, setContent, showImage = true }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Only run on client
        setIsClient(true);
    }, []);

    let imageLink = ['link', 'image'];
    if (!showImage) {
        imageLink = ['link'];
    }

    const modules = {
        toolbar: [
            [{ header: '1' }, { header: '2' }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['bold', 'italic', 'underline'],
            [{ align: [] }],
            [...imageLink]
        ],
    };

    const handleChange = (value) => {
        setContent(value);
    };

    if (!isClient) return null;

    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <ReactQuill
                value={content}
                onChange={handleChange}
                modules={modules}
                theme="snow"
            />
        </Suspense>
    );
}

export default TextEditor;
