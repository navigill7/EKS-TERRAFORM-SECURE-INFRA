resource "aws_vpc" "eks-vpc" {
  cidr_block = var.cidr_block
  instance_tenancy = "default"
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = var.vpc_name
    Env = var.env
  }
}

resource "aws_internet_gateway" "eks_internet_gateway" {
  vpc_id = aws_vpc.eks-vpc.id

  tags = {
    Name  = var.igw_name
    ENV = var.env
    "kubernetes.io/cluster/${local.cluster-name}" = "owned"
  }

  depends_on = [ aws_vpc.eks-vpc ]

}

resource "aws_subnet" "eks_public_subnet" {
  count = var.eks_public_subnet_count
  vpc_id = aws_vpc.eks-vpc.id
  cidr_block = element(var.pub_cidr_block , count.index)
  availability_zone = element(var.pub_az , count.index)

  map_public_ip_on_launch = true

  tags = {
    Name  =  "${var.pub_sub_name}-${count.index+1}"
    env = var.env
    "kubernetes.io/cluster/${local.cluster-name}" = "owned"
    "Kubernetes.io/role/elb" = "1"
  }

  depends_on = [ aws_vpc.eks-vpc ]
}

resource "aws_subnet" "eks_private_subnet" {
  count = var.eks_private_subnet_count
  vpc_id = aws_vpc.eks-vpc.id
  cidr_block = element(var.private_cidr_block , count.index)
  availability_zone = element(var.pri-az , count.index)

  map_public_ip_on_launch = true

  tags = {
    Name  =  "${var.pri_sub_name}-${count.index+1}"
    env = var.env
    "kubernetes.io/cluster/${local.cluster-name}" = "owned"
    "Kubernetes.io/role/elb" = "1"
  }

  depends_on = [ aws_vpc.eks-vpc ]
}

resource "aws_route_table" "eks_public_rt" {
  vpc_id = aws_vpc.eks-vpc.id

  route  {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.eks_internet_gateway.id
  }

  tags = {
    Name = var.public-rt-name
    env = var.env

  }

  depends_on = [ aws_vpc.eks-vpc ]
}

resource "aws_route_table_association" "eks_public_rt_association" {
    count = 3
    route_table_id = aws_route_table.eks_public_rt.id

    subnet_id = aws_subnet.eks_public_subnet[count.index].id

    depends_on = [ aws_vpc.eks-vpc , aws_subnet.eks_public_subnet ]
}

resource "aws_eip" "eks_nat_eip" {
  domain = "vpc"

  tags = {
    Name = var.eip_name
  }

  depends_on = [ aws_vpc.eks-vpc ]
}

resource "aws_nat_gateway" "eks_nat_gateway" {
  allocation_id = aws_eip.eks_nat_eip.id
  subnet_id = aws_subnet.eks_public_subnet[0].id

  tags = {
    Name  = var.eks_nat_gateway

  }

  depends_on = [ aws_vpc.eks-vpc , aws_eip.eks_nat_eip ]
}

resource "aws_route_table" "eks_private_rt" {
  vpc_id = aws_vpc.eks-vpc.id

  route  {
    cidr_block = "0.0.0.0/0"
    gateway_id  = aws_nat_gateway.eks_nat_gateway.id
  }

  tags = {
    Name = var.eks_private_rt_name
    env = var.env
  }

  depends_on = [ aws_vpc.eks-vpc ]
}

resource "aws_route_table_association" "eks_private_rt_association" {

  count = 3
  route_table_id = aws_route_table.eks_private_rt.id

  subnet_id = aws_subnet.eks_private_subnet[count.index].id

  depends_on = [ aws_vpc.eks-vpc , aws_subnet.eks_private_subnet ] 
}

resource "aws_security_group" "eks_security_group" {

  name = var.eks_sg_name
  description = "Allow 443 port from jump servers only"

  vpc_id = aws_vpc.eks-vpc.id

  ingress {
    from_port = 443 
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = var.eks_sg_name
  }
}

variable "is_kms_key_enabled" {
  type = bool 
  
}

