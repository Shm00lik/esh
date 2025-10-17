import "./CenteredPage.scss";

const CenteredPage = ({ children }: CenteredPageProps) => {
  return <div className="centered-page">{children}</div>;
};

export default CenteredPage;

interface CenteredPageProps {
  children: React.ReactNode;
}
