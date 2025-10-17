import { Typography, Box } from "@mui/material";
import CenteredPage from "../../components/CenteredPage/CenteredPage";

const QRRequest = () => {
    return (
        <CenteredPage>
            <Box sx={{ p: 3, textAlign: 'center', direction: 'rtl' }}>
                <Typography variant="h5">
                    אנא בקש/י קוד QR כדי להיכנס.
                </Typography>
            </Box>
        </CenteredPage>
    );
}

export default QRRequest;
