import { Modal } from "@shopify/polaris";

export default function ViewSwatchModal({
    open, setOpen, swatch
}) {
    return <Modal
    title={`View Swatch`}
        open={open}
        onClose={() => setOpen(false)}
    >
        <Modal.Section>
            <pre>{JSON.stringify(swatch, null, 2)}</pre>
        </Modal.Section>
    </Modal>
}