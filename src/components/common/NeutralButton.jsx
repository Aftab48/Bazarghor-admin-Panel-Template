import { Button } from "antd";

const neutralButtonStyle = {
  backgroundColor: "#3c2f3d",
  color: "#ffffff",
  borderColor: "#3c2f3d",
};

const add = {
  background: "#9dda52",
  borderColor: "#9dda52",
  color: "#3c2f3d",
  border: "0.2px solid #3c2f3d",
};
const NeutralButton = ({ children = "Cancel", style, ...rest }) => {
  return (
    <Button style={{ ...neutralButtonStyle, ...style }} {...rest}>
      {children}
    </Button>
  );
};

const AddNeutralButton = ({ children = "Add", add, ...rest }) => {
  return (
    <Button style={{ ...add, ...add }} {...rest}>
      {children}
    </Button>
  );
};

export { AddNeutralButton, NeutralButton };
