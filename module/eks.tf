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


// OIDC provider 

resource "aws_iam_openid_connect_provider" "eks_oidc_provider" {
  
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks-certificate[0].sha1_fingerprint]

  url = data.tls_certificate.eks-certificate.url 
}


// Addons for implemeting the networking solutions and installing other important component like kube proxy 

resource "aws_eks_addon" "eks_addons" {
  for_each = {for idx , addons in var.addons : idx => addons }

  cluster_name =  aws_eks_cluster.eks[0].name
  addon_name = each.value.name
  addon_version = each.value.version

   depends_on = [
    aws_eks_node_group.ondemand-node,
    aws_eks_node_group.spot-node
  ]

}

