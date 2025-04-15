resource "aws_instance" "eks_bastion" {
  ami           = "ami-084568db4383264d4" 
  instance_type = "t3.micro"
  key_name      = "eks_basition_access"
  subnet_id     =  aws_subnet.eks_public_subnet[0].id
  associate_public_ip_address = true

  vpc_security_group_ids = [aws_security_group.eks_bastion_sg.id]

  tags = {
    Name = "EKS-Bastion-Host"
    Env  = var.env
  }

  depends_on = [aws_internet_gateway.eks_internet_gateway]

    user_data = <<-EOF
              #!/bin/bash
              yum update -y

              # Install AWS CLI
              curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              sudo ./aws/install

              # Install kubectl
              curl -o kubectl https://s3.us-west-2.amazonaws.com/amazon-eks/1.29.0/2024-03-14/bin/linux/amd64/kubectl
              chmod +x ./kubectl
              mv ./kubectl /usr/local/bin/

              # Verify installation
              kubectl version --client
              aws --version
              EOF

}

resource "aws_security_group" "eks_bastion_sg" {
  name        = "eks-bastion-sg"
  description = "Allow SSH from your IP"
  vpc_id      = aws_vpc.eks-vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["<your-ip>/32"]  # Replace with your actual IP
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "eks-bastion-sg"
    Env  = var.env
  }
}
