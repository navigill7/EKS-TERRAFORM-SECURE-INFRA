locals {
  cluster-name = var.cluster-name
}

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


locals {
  cluster-name = var.cluster-name
}

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


