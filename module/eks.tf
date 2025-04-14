resource "aws_eks_cluster" "eks" {
  count = var.is_eks_cluster_enabled == true ? 1 : 0 
  name = var.cluster-name
  role_arn = aws_iam_role.eks_oidc_role.arn

  version = var.kubernetes_version

  vpc_config {
    subnet_ids = [aws_subnet.eks_private_subnet[0].id , aws_subnet.eks_private_subnet[1].id , aws_subnet.eks_private_subnet[2].id ]
    endpoint_private_access = var.cluster_private_access
    endpoint_public_access = var.cluster_public_access
    security_group_ids = [aws_security_group.eks_security_group.id]
  }

  access_config {
    authentication_mode = "CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  tags = {
    Name = var.cluster-name
    env = var.env
  }
}


