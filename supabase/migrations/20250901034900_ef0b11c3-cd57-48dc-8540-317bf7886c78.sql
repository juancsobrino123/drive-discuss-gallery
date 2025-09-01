-- Drop the problematic SELECT policy and create a simpler one
DROP POLICY IF EXISTS "View group memberships" ON group_members;

-- Create a much simpler SELECT policy that avoids recursion
CREATE POLICY "View group memberships simple" 
ON group_members 
FOR SELECT 
USING (
  -- Users can see their own memberships
  auth.uid() = user_id 
  -- Or admins can see all memberships
  OR has_role(auth.uid(), 'admin'::app_role)
);