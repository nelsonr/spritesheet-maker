import { useState, createRef, FormEvent } from "react";

type Preview = {
    image: Blob | null;
    css: string | null;
};

export default function Spritesheet() {
    const [preview, setPreview] = useState<Preview>({ image: null, css: null });

    const fileInputRef = createRef<HTMLInputElement>();
    const endpoint = "/api/spritesheet";

    const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
        if (fileInputRef && fileInputRef.current) {
            const files = fileInputRef.current.files;

            if (files && files.length > 0) {
                const formData = new FormData();

                for (const file of files) {
                    formData.append("images", file);
                }

                const sendFile = fetch(endpoint, {
                    method: "POST",
                    body: formData,
                });

                // sendFile
                //     .then((resp) => resp.formData())
                //     .then((data: FormData) => {
                //         const preview: Preview = {
                //             image: data.get("image") as Blob,
                //             css: data.get("css") as string,
                //         };

                //         setPreview(preview);
                //     });
            }
        }

        ev.preventDefault();
    };

    const ImagePreview = () => {
        if (preview.image) {
            const imageURL = URL.createObjectURL(preview.image);

            return <img src={imageURL} />;
        }

        return null;
    };

    return (
        <div className="sg">
            <form className="sg__form" onSubmit={onSubmit}>
                <input ref={fileInputRef} type="file" name="image" id="image" multiple />
                <input type="submit" value="Submit" />
            </form>

            <div className="sg__preview">
                <div className="sg__preview-css">
                    <pre>{preview.css}</pre>
                </div>
                <div className="sg__preview-image">
                    <ImagePreview />
                </div>
            </div>
        </div>
    );
}
