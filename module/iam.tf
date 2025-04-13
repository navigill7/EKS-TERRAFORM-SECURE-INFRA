locals {
  cluster-name = var.cluster-name
}

resource "random_integer" "random_suffix" {
    min = 1000

    max = 9999
  
}

resource "aws_iam_role" "eks_cluster_role" {
  count = var.is_eks_role_enabled ? 1 : 0
  name = "${local.cluster-name}-role-${random_integer.random_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "AmazonEKSClusterPolicy" {
  count      = var.is_eks_role_enabled ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks-cluster-role[count.index].name
}