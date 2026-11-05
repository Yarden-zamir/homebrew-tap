# typed: false
# frozen_string_literal: true

class Issuegator < Formula
  desc "Rust TUI GitHub issue explorer for the current repository"
  homepage "https://github.com/Yarden-zamir/issuegator"
  url "https://github.com/Yarden-zamir/issuegator/archive/refs/tags/v0.2.0.tar.gz"
  sha256 "6bdfe6f0bf03da0170eec89d1d00c4c8fdcb491617572e38ad739370af33ee64"
  license "MIT"
  head "https://github.com/Yarden-zamir/issuegator.git", branch: "main"

  depends_on "rust" => :build
  depends_on "gh"

  def install
    system "cargo", "install", *std_cargo_args
  end

  test do
    assert_path_exists bin/"issuegator"
  end
end
