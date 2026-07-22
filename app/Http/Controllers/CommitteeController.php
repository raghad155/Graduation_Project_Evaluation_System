<?php

namespace App\Http\Controllers;

use App\Models\Committee;
use Illuminate\Http\Request;

class CommitteeController extends Controller
{
    /**
     * Display a listing of committees.
     */
    public function index()
    {
        $committees = Committee::with(['users' => function($query) {
            $query->select('users.id', 'full_name', 'email', 'phone_number');
        }, 'projects:id,title,committee_id'])->get();

        return response()->json($committees);
    }

    /**
     * Store a newly created committee.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'exists:projects,id'
        ]);

        $committee = Committee::create([
            'name' => $request->name
        ]);

        if ($request->has('user_ids')) {
            $committee->users()->sync($request->user_ids);
        }

        if ($request->has('project_ids')) {
            \App\Models\Project::whereIn('id', $request->project_ids)->update(['committee_id' => $committee->id]);
        }

        return response()->json([
            'message'   => 'Committee created successfully',
            'committee' => $committee->load('users', 'projects')
        ], 201);
    }

    /**
     * Display the specified committee.
     */
    public function show($id)
    {
        $committee = Committee::with(['users', 'projects'])->findOrFail($id);
        return response()->json($committee);
    }

    /**
     * Update the specified committee.
     */
    public function update(Request $request, $id)
    {
        $committee = Committee::findOrFail($id);

        $request->validate([
            'name'     => 'required|string|max:255',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'exists:projects,id'
        ]);

        $committee->update(['name' => $request->name]);

        if ($request->has('user_ids')) {
            $committee->users()->sync($request->user_ids);
        }

        if ($request->has('project_ids')) {
            \App\Models\Project::where('committee_id', $committee->id)
                ->whereNotIn('id', $request->project_ids)
                ->update(['committee_id' => null]);
            
            if (!empty($request->project_ids)) {
                \App\Models\Project::whereIn('id', $request->project_ids)
                    ->update(['committee_id' => $committee->id]);
            }
        }

        return response()->json([
            'message'   => 'Committee updated successfully',
            'committee' => $committee->fresh()->load('users', 'projects')
        ]);
    }

    /**
     * Remove the specified committee.
     */
    public function destroy($id)
    {
        $committee = Committee::findOrFail($id);
        $committee->delete();

        return response()->json([
            'message' => 'Committee deleted successfully'
        ]);
    }
}
