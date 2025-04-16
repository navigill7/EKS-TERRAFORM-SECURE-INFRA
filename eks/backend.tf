terraform {
  required_version = ">= 1.8.4, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.49.0"
    }

    helm = {
       source  = "hashicorp/helm"
       version = "= 2.5.1"
    }
  }

  backend "s3" {
    bucket         = "eks-backend-state-bucket"
    region         = "us-east-1"
    key            = "eks/terraform.tfstate"
    dynamodb_table = "Lock_Files"
    encrypt        = true
  }


}

provider "aws" {
  region = var.region
}

data "aws_eks_cluster" "eks" {
  name = aws_eks_cluster.eks[0].name
}

data "aws_eks_cluster_auth" "eks" {
  name = aws_eks_cluster.eks[0].name
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.eks.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.eks.token
    load_config_file       = false
  }
}

